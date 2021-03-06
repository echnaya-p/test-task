import { useCallback, useState } from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import SaveIcon from '@material-ui/icons/Save';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import { TodoItem, useTodoItems } from './TodoItemsContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TextField from '@material-ui/core/TextField';

const useTodoItemListStyles = makeStyles({
	root: {
		listStyle: 'none',
		padding: 0,
	},
});

export const TodoItemsList = function () {
	const { todoItems } = useTodoItems();
	const { dispatch } = useTodoItems();

	const classes = useTodoItemListStyles();

	const sortedItems = todoItems.slice().sort((a, b) => {
		if (a.done && !b.done) {
			return 1;
		}

		if (!a.done && b.done) {
			return -1;
		}

		return 0;
	});

	const reorder = (list: TodoItem[], startIndex: number, endIndex: number) => {
		const result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);

		return result;
	};

	type Id = string;
	type DraggableId = Id;
	type DroppableId = Id;
	type TypeId = Id;
	type DraggableLocation = {
		droppableId: DroppableId;
		index: number;
	};
	type DropReason = 'DROP' | 'CANCEL';
	type MovementMode = 'FLUID' | 'SNAP';
	type DropResult = {
		draggableId: DraggableId;
		type: TypeId;
		source: DraggableLocation;
		mode: MovementMode;
		destination: DraggableLocation;
		reason: DropReason;
	};

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}

		const items = reorder(sortedItems, result.source.index, result.destination.index);

		dispatch({ type: 'reorder', data: items });
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Droppable droppableId="droppable">
				{provided => (
					<ul className={classes.root} {...provided.droppableProps} ref={provided.innerRef}>
						{sortedItems.map((item, index) => (
							<Draggable key={item.id} draggableId={item.id} index={index}>
								{provided => (
									<li key={item.id} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
										<TodoItemCard item={item} />
									</li>
								)}
							</Draggable>
						))}
					</ul>
				)}
			</Droppable>
		</DragDropContext>
	);
};

const useTodoItemCardStyles = makeStyles({
	root: {
		marginTop: 24,
		marginBottom: 24,
	},
	doneRoot: {
		textDecoration: 'line-through',
		color: '#888888',
	},
});

export const TodoItemCard = function ({ item }: { item: TodoItem }) {
	const classes = useTodoItemCardStyles();
	const { dispatch } = useTodoItems();
	const [isEdit, setEdit] = useState(false);
	const [editedTitle, setEditedTitle] = useState('');
	const [editedDetails, setEditedDetails] = useState('');
	const [editedDone, setEditedDone] = useState(false);

	const handleDelete = useCallback(() => dispatch({ type: 'delete', data: { id: item.id } }), [item.id, dispatch]);

	const handleEdit =
		({ id, title, details = '', done }: TodoItem) =>
		() => {
			setEditedTitle(title);
			setEditedDetails(details);
			setEditedDone(done);
			setEdit(!isEdit);
		};

	const handleSave = () => {
		dispatch({
			type: 'edit',
			data: { id: item.id, title: editedTitle, details: editedDetails, done: editedDone },
		});
		setEdit(!isEdit);
	};

	const handleToggleDone = useCallback(
		() =>
			dispatch({
				type: 'toggleDone',
				data: { id: item.id },
			}),
		[item.id, dispatch],
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.id === 'title') {
			setEditedTitle(e.target.value);
		} else setEditedDetails(e.target.value);
	};

	return (
		<Card
			className={classnames(classes.root, {
				[classes.doneRoot]: item.done,
			})}
		>
			<CardHeader
				action={
					<>
						{isEdit ? (
							<IconButton aria-label="edit" onClick={handleSave}>
								<SaveIcon />
							</IconButton>
						) : (
							<IconButton
								aria-label="edit"
								onClick={handleEdit({
									id: item.id,
									title: item.title,
									details: item?.details,
									done: item.done,
								})}
							>
								<EditIcon />
							</IconButton>
						)}
						<IconButton aria-label="delete" onClick={handleDelete}>
							<DeleteIcon />
						</IconButton>
					</>
				}
				title={
					isEdit ? (
						<>
							<TextField id="title" variant="standard" value={editedTitle} onChange={handleChange} />
						</>
					) : (
						<FormControlLabel
							control={
								<Checkbox checked={item.done} onChange={handleToggleDone} name={`checked-${item.id}`} color="primary" />
							}
							label={item.title}
						/>
					)
				}
			/>
			{item?.details && (
				<CardContent>
					{isEdit ? (
						<TextField id="details" variant="standard" value={editedDetails} onChange={handleChange} />
					) : (
						<Typography variant="body2" component="p">
							{item.details}
						</Typography>
					)}
				</CardContent>
			)}
		</Card>
	);
};
