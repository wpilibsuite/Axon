import React, { ReactElement } from "react";
import gql from "graphql-tag";
import {
  CircularProgress,
  Container,
  GridList,
  GridListTile,
  IconButton,
  Menu,
  Toolbar,
  Typography
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { LazyLoadImage, ScrollPosition, trackWindowScroll } from "react-lazy-load-image-component";
import { GetDataset, GetDataset_dataset_images, GetDatasetVariables } from "./__generated__/GetDataset";
import { useQuery } from "@apollo/client";
import RenameDatasetDialogButton from "./RenameDatasetDialog";
import DeleteDatasetDialogButton from "./DeleteDatasetDialog";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  progress: {
    color: "#FFFFFF",
    marginLeft: 50
  }
}));

const GET_DATASET = gql`
  query GetDataset($id: ID!) {
    dataset(id: $id) {
      id
      name
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
    <GridList cellHeight={160} cols={3}>
      {props.images.map((image, index) => (
        <GridListTile key={index}>
          <LazyLoadImage
            alt={image.path}
            height={image.size.height}
            width={image.size.width}
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
  const { data, loading, error } = useQuery<GetDataset, GetDatasetVariables>(GET_DATASET, {
    variables: {
      id: props.id
    }
  });

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (loading) return <CircularProgress className={classes.progress} />;
  if (error || !data || !data.dataset) return <p>ERROR</p>;
  return (
    <Container>
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
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
        </Menu>
      </Toolbar>
      <Container>
        <Typography variant="h6">{data.dataset?.images.length} Image Samples</Typography>
        <DataGallery images={data.dataset?.images || []} />
      </Container>
    </Container>
  );
}
