import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Box,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const EnhancedTableHead = (props) => {
  const {
    columns,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    enableSelection,
  } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {enableSelection && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{ 'aria-label': 'select all' }}
            />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.numeric ? 'right' : 'left'}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.id ? order : false}
            style={{ minWidth: column.minWidth }}
          >
            {column.sortable ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
        {(props.onEdit || props.onView || props.onDelete) && (
          <TableCell align="right">Actions</TableCell>
        )}
      </TableRow>
    </TableHead>
  );
};

const EnhancedTableToolbar = (props) => {
  const { numSelected, title, filterComponent } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) => theme.palette.primary.light,
          color: (theme) => theme.palette.primary.contrastText,
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          {title}
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={props.onDeleteSelected}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        filterComponent && (
          <Box>
            {filterComponent}
          </Box>
        )
      )}
    </Toolbar>
  );
};

const DataTable = ({
  columns,
  data,
  title = 'Data Table',
  loading = false,
  enableSelection = false,
  onRowClick,
  onEdit,
  onView,
  onDelete,
  onDeleteSelected,
  filterComponent,
  pagination = {
    page: 0,
    rowsPerPage: 10,
    count: 0,
  },
  onPageChange,
  onRowsPerPageChange,
  serverSidePagination = false,
}) => {
  const theme = useTheme();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(pagination.page || 0);
  const [rowsPerPage, setRowsPerPage] = useState(pagination.rowsPerPage || 10);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    if (!enableSelection) {
      return;
    }

    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    if (serverSidePagination) {
      if (onPageChange) {
        onPageChange(newPage);
      }
    } else {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (serverSidePagination) {
      if (onRowsPerPageChange) {
        onRowsPerPageChange(newRowsPerPage);
      }
    } else {
      setRowsPerPage(newRowsPerPage);
      setPage(0);
    }
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Sort and paginate data locally if not using server-side pagination
  const sortedData = serverSidePagination
    ? data
    : stableSort(data, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length);

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <EnhancedTableToolbar
        numSelected={selected.length}
        title={title}
        onDeleteSelected={() => onDeleteSelected && onDeleteSelected(selected)}
        filterComponent={filterComponent}
      />
      <TableContainer>
        {loading && (
          <LinearProgress />
        )}
        <Table aria-labelledby="tableTitle" size="medium">
          <EnhancedTableHead
            columns={columns}
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={data.length}
            enableSelection={enableSelection}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
          />
          <TableBody>
            {sortedData.map((row, index) => {
              const isItemSelected = enableSelection && isSelected(row.id);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.id}
                  selected={isItemSelected}
                  onClick={(event) => onRowClick && onRowClick(event, row)}
                >
                  {enableSelection && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleClick(event, row.id);
                        }}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.numeric ? 'right' : 'left'}>
                        {column.render ? column.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                  {(onEdit || onView || onDelete) && (
                    <TableCell align="right">
                      {onView && (
                        <Tooltip title="View">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              onView(row);
                            }}
                            color="info"
                            size="small"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onEdit && (
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}
                            color="primary"
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(row);
                            }}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {emptyRows > 0 && !serverSidePagination && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={columns.length + (enableSelection ? 1 : 0) + (onEdit || onView || onDelete ? 1 : 0)} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={serverSidePagination ? pagination.count : data.length}
        rowsPerPage={serverSidePagination ? pagination.rowsPerPage : rowsPerPage}
        page={serverSidePagination ? pagination.page : page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;
