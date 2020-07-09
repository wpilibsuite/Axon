import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Button, Divider, Paper, TextField, Toolbar, Tooltip, Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import Grid from "@material-ui/core/Grid";

export default function Training() {
  return (
    <Paper>
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Training
        </Typography>
      </Toolbar>
      <Button variant="contained">Train Model</Button>
      <Divider />
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Advanced</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={10}>
              <TextField
                variant="outlined"
                id="standard-number"
                label="Epochs"
                type="number"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="The number of epochs.">
                <HelpOutlineIcon />
              </Tooltip>
            </Grid>

            <Grid item xs={10}>
              <TextField
                variant="outlined"
                id="standard-number"
                label="Batch size"
                type="number"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="The batch size.">
                <HelpOutlineIcon />
              </Tooltip>
            </Grid>

            <Grid item xs={10}>
              <TextField
                variant="outlined"
                id="standard-number"
                label="Learning rate"
                type="number"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="The learning rate.">
                <HelpOutlineIcon />
              </Tooltip>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Button>Reset defaults</Button>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Button>Under the hood</Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
