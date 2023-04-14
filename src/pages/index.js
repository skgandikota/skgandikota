import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import { makeStyles } from "@mui/styles";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import LangugageAndTools from '../components/LanguagesAndTools';
import AboutMe from '../components/AboutMe';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: "10%",
    textAlign: "justify",
    height: "100%",
    overflowY: "scroll",
  },
  image: {
    backgroundImage: "url(./img/1649731867371.jpeg)",
    backgroundSize: "cover",
    backgroundPosition: 'center',
    height: "100vh",
  },
}));

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const classes = useStyles();
  return (
    <Layout
      title={`Me ${siteConfig.title}`}
      description='Description will go into a meta tag in <head />'
    >
      <div className={classes.root}>
        <Grid container spacing={0}>
          <Grid item xs={12} sm={6}>
            <div className={classes.image} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <section id='AboutMe'> 
               <AboutMe/>
              </section>
              <section id='LanguageAndTools'> 
                <LangugageAndTools/>
              </section>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </Layout>
  );
}
