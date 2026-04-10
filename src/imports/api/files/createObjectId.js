import { MongoInternals } from "meteor/mongo";

export const createObjectId = ({ gridFsFileId }) =>
	new MongoInternals.NpmModules.mongodb.module.ObjectId(gridFsFileId);
