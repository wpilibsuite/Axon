import React, { ReactElement, useEffect } from "react";
import gql from "graphql-tag";
import {
  Card,
  CircularProgress,
  List,
  Grid,
  GridList,
  GridListTile,
  IconButton,
  Link,
  ListItem,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  ListItemText,
  ListItemIcon
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Pagination from "@material-ui/lab/Pagination";
import { LazyLoadImage, ScrollPosition, trackWindowScroll } from "react-lazy-load-image-component";
import { GetDataset, GetDataset_dataset_images, GetDatasetVariables } from "./__generated__/GetDataset";
import { useQuery } from "@apollo/client";
import RenameDatasetDialogButton from "./RenameDatasetDialog";
import DeleteDatasetDialogButton from "./DeleteDatasetDialog";
import { makeStyles } from "@material-ui/core/styles";
import { Label } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  progress: {
    marginLeft: 50
  },
  root: {
    flexGrow: 1,
    paddingLeft: 25,
    paddingRight: 25
  },
  card: {
    padding: 10
  },
  centered: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 10
  }
}));

const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
      path
      classes
      images {
        path
        size {
          width
          height
        }
      }
    }
  }
`;

function DataGalleryBase(props: { images: GetDataset_dataset_images[]; scrollPosition: ScrollPosition }) {
  return (
    <GridList cellHeight={300} cols={3}>
      {props.images.map((image, index) => (
        <GridListTile key={index}>
          <LazyLoadImage
            alt={image.path}
            height={300}
            src={encodeURI(`http://localhost:4000/${image.path}`)}
            scrollPosition={props.scrollPosition}
          />
        </GridListTile>
      ))}
    </GridList>
  );
}

const DataGallery = trackWindowScroll(DataGalleryBase);

export default function Dataset(props: { id: string }): ReactElement {
  const classes = useStyles();
  const [pageNumber, setPageNumber] = React.useState(0);
  const [idState, setIdState] = React.useState(props.id);
  const { data, loading, error } = useQuery<GetDataset, GetDatasetVariables>(GET_DATASET, {
    variables: {
      id: props.id
    }
  });

  if (idState !== props.id) {
    setIdState(props.id);
  }

  useEffect(() => {
    setPageNumber(0);
  }, [idState]);

  const imagesPerPage = 48;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handlePage = (event: React.ChangeEvent<unknown>, value: number) => {
    setPageNumber(value - 1);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (loading) return <CircularProgress className={classes.progress} />;
  if (error || !data || !data.dataset) {
    console.log(error);
    return <p>ERROR</p>;
  }
  console.log(data.dataset.classes);
  return (
    <div className={classes.root}>
      <Toolbar>
        <Typography variant="h5" style={{ flexGrow: 1 }}>
          {data.dataset?.name}
        </Typography>
        <IconButton onClick={handleMenu} color="inherit">
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <RenameDatasetDialogButton id={props.id} handler={handleClose} />
          <DeleteDatasetDialogButton dataset={data.dataset} handler={handleClose} />
          <MenuItem>
            <Link
              href={`http://localhost:4000/${data.dataset?.path}`}
              color={"inherit"}
              target={"_blank"}
              style={{ textDecoration: "none" }}
            >
              <Typography variant={"body1"}>Download</Typography>
            </Link>
          </MenuItem>
        </Menu>
      </Toolbar>
      <Grid container spacing={3} style={{ paddingLeft: 50 }}>
        <Grid item>
          <Card className={classes.card}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant={"h6"}>Stats</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>Images: {data.dataset?.images.length}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>Labels:</Typography>
              </Grid>
            </Grid>
            <List>
              {data.dataset.classes.map((value) => {
                return (
                  <ListItem key={value}>
                    <ListItemIcon>
                      <Label />
                    </ListItemIcon>
                    <ListItemText primary={value} />
                  </ListItem>
                );
              })}
            </List>
          </Card>
        </Grid>
        <Grid item xs={10}>
          <DataGallery
            images={data.dataset?.images.slice(pageNumber * imagesPerPage, (pageNumber + 1) * imagesPerPage) || []}
          />
          <Pagination
            className={classes.centered}
            count={Math.floor((data?.dataset?.images.length || 0) / imagesPerPage + 1)}
            page={pageNumber + 1}
            onChange={handlePage}
          />
        </Grid>
      </Grid>
    </div>
  );
}
