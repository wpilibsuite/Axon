import React, { ReactElement } from "react";
import { Container, Divider, GridList, GridListTile, IconButton, Paper, Toolbar, Typography } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { LazyLoadImage, ScrollPosition, trackWindowScroll } from "react-lazy-load-image-component";
// import { GetDatasets_datasets_images } from "./__generated__/GetDatasets";

// export interface Props {
//   name: string;
//   images: GetDatasets_datasets_images[];
// }
//
// function DataGalleryBase(props: { images: GetDatasets_datasets_images[]; scrollPosition: ScrollPosition }) {
//   return (
//     <GridList cellHeight={160} cols={3}>
//       {props.images.map((image, index) => (
//         <GridListTile key={index}>
//           <LazyLoadImage
//             alt={image.path}
//             height={image.size.height}
//             width={image.size.width}
//             src={encodeURI(`http://localhost:4000/${image.path.replace("data/datasets", "dataset")}`)}
//             scrollPosition={props.scrollPosition}
//           />
//         </GridListTile>
//       ))}
//     </GridList>
//   );
// }
//
// const DataGallery = trackWindowScroll(DataGalleryBase);
//
// export default function Dataset({ name, images }: Props): ReactElement {
//   return (
//     <Paper>
//       <Toolbar>
//         <Typography variant="h6" style={{ flexGrow: 1 }}>
//           {name}
//         </Typography>
//         <IconButton color="inherit">
//           <MoreVertIcon />
//         </IconButton>
//       </Toolbar>
//       <Divider />
//       <Container>
//         <Typography variant="h6">{images.length} Image Samples</Typography>
//         <DataGallery images={images} />
//       </Container>
//     </Paper>
//   );
// }

export default function Dataset() {
  return <></>;
}
