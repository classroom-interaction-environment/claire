import FileType from "file-type";
import { createLog } from "../../../../api/log/createLog";
import { fileExists } from "../../../../api/utils/filesystem/fileExists";
import fs from "node:fs/promises";

const log = createLog({ name: "videoConvert" });
const mp4Extension = "mp4";
/**
 * Converts a given file to mp4/h264
 * @async
 * @param uploadedFile
 * @return {Promise<file>}
 */
export const videoConvert = async function convertVideo(uploadedFile) {
	log("run on", uploadedFile.name, uploadedFile._id);
	const { _id, size, path, /* extension, */ name, _storagePath } = uploadedFile;
	const modifier = { $set: {} };

	try {
		uploadedFile.versions.poster = await createPoster(uploadedFile);
		modifier.$set["versions.poster"] = uploadedFile.versions.poster;
	} catch (e) {
		log("could not create poster");
		console.error(e);
	}

	// for now we assume mp4 files to be support, even if the
	// internal codec may not be h264
	// if (extension === mp4Extension) {
	//  Promise.await(filesCollection.collection.update(uploadedFile._id, modifier))
	//  return resolve(Promise.await(filesCollection.collection.findOne(uploadedFile._id)))
	// }

	// we simply run ffmpeg on all we can find in hope the output is smaller
	// than the original
	const compressedPath = `${_storagePath}/compressed-${_id}.${mp4Extension}`;
	const command = `-i ${path} -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -crf 22 -preset slow -vf scale=1280:-2 -c:a aac -b:a 192k -strict experimental -movflags +faststart -threads 0 ${compressedPath}`;
	// `-i ${path}  -c:a aac -c:v libx264 ${compressedPath}`
	// -i ${path} -vcodec h264 -acodec aac -strict -2 ${compressedPath}
	// -i ${path} -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3 ${compressedPath}
	// -i ${path} -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -crf 20 -movflags +faststart -threads 0
	// ${compressedPath} -i ${path} -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -crf 22 -preset slow -vf
	// scale=1280:-2 -c:a aac -b:a 192k -strict experimental -movflags +faststart -threads 0 ${compressedPath}"

	await ffmpeg(command);

	const mp4Stats = await fileExists(compressedPath);
	const mp4Mime = await FileType.fromFile(compressedPath);

	log("compressed size is", mp4Stats.size);
	log("originals size was", size);

	// we replace original as we don't want to support other formats than mp4
	// when it comes to streaming/downloading them to different browsers/devices
	uploadedFile.versions.original = {
		path: compressedPath,
		size: mp4Stats.size,
		type: mp4Mime.mime,
		extension: mp4Mime.ext,
		meta: {},
	};

	const extensionIndex = name.lastIndexOf(".");
	const baseName = name.substring(0, extensionIndex - 1);

	Object.assign(modifier.$set, {
		name: `${baseName}.${mp4Extension}`,
		size: mp4Stats.size,
		type: mp4Mime.mime,
		path: compressedPath,
		mime: mp4Mime.mime,
		"mime-type": mp4Mime.mime,
		ext: mp4Extension,
		extension: mp4Extension,
		extensionWithDot: `.${mp4Extension}`,
	});

	modifier.$set["versions.original"] = uploadedFile.versions.original;
	log("update collection");
	await this.collection.updateAsync(uploadedFile._id, modifier);
	try {
		await fs.rm(path);
	} catch (e) {
		log("could not remove original file", path);
		console.error(e);
	}

	// we need to return the updated file
	const updatedFile = await this.collection.findOneAsync(uploadedFile._id);
	log("done", updatedFile);
	return updatedFile;
};

async function createPoster({ _id, _storagePath, path }) {
	// create screenshot for video thumbnail here so we can early on display
	// some loading indicator with also a "preview" image
	const posterPath = `${_storagePath}/poster-${_id}.jpg`;
	const posterStats = await fileExists(posterPath);
	const posterCommand = `-ss 00:00:05 -i ${path} -frames:v 1 -q:v 2 ${posterPath}`;
	await ffmpeg(posterCommand);

	// update poster version
	return {
		path: posterPath,
		size: posterStats.size,
		type: "image/jpeg",
		extension: "jpg",
		meta: {
			// TODO with/height
		},
	};
}

async function ffmpeg(command) {
	const _ffmpeg = await import("ffmpeg-cli");
	log("ffmpeg", command);
	return _ffmpeg.run(command);
}
