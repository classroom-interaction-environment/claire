export const taskIsEditable = ({ lessonDoc, taskId, groupDoc }) => {
	const isEditable = (ref) => ref._id === taskId;
	return (
		(lessonDoc?.visibleStudent || []).some(isEditable) ||
		(groupDoc?.visible || []).some(isEditable)
	);
};
