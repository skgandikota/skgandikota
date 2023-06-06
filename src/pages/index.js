import React from "react";
import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import { useColorMode } from "@docusaurus/theme-common";
import styles from "./index.module.css";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Experience from "../components/Experience/Experience";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const [value, setValue] = React.useState("one");

  const handleChange = (_event, newValue) => {
    setValue(newValue);
  };
  return (
    <>
      <div className='flex-container'>
        <div className='flex-item-left'>
          {useColorMode().colorMode === "dark" ? (
            <img
              width={"100%"}
              className='trophy'
              src='img/dark.png'
              alt='skgandikota'
            />
          ) : (
            <img
              width={"100%"}
              className='trophy'
              src='img/light.png'
              alt='skgandikota'
            />
          )}
        </div>
        <div className='flex-item-right'>
          <header className={clsx("hero", styles.heroBanner)}>
            <div className='container'>
              <h1 className='hero__title'>Hi 👋, I'm {siteConfig.title}</h1>
              <p className='hero__subtitle'>{siteConfig.tagline}</p>
              {useColorMode().colorMode === "dark" ? (
                <img
                  className='trophy'
                  src='https://github-profile-trophy.vercel.app/?username=skgandikota&title=Commits,PullRequest,Issues,Repositories,Stars,Followers&no-frame=true&theme=onedark&margin-w=15'
                  alt='skgandikota'
                />
              ) : (
                <img
                  className='trophy'
                  src='https://github-profile-trophy.vercel.app/?username=skgandikota&title=Commits,PullRequest,Issues,Repositories,Stars,Followers&no-frame=true&margin-w=15'
                  alt='skgandikota'
                />
              )}
              {useColorMode().colorMode === "dark" ? (
                <img
                  width={"76%"}
                  className='trophy'
                  src='https://github-readme-streak-stats.herokuapp.com/?user=skgandikota&theme=dark'
                  alt='skgandikota'
                />
              ) : (
                <img
                  width={"76%"}
                  className='trophy'
                  src='https://github-readme-streak-stats.herokuapp.com/?user=skgandikota'
                  alt='skgandikota'
                />
              )}
            </div>
          </header>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description='Description will go into a meta tag in <head />'
    >
      <HomepageHeader />
      <HomepageFeatures />
    </Layout>
  );
}
