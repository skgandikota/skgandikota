import { Stack } from "@mui/material";
import React from "react";

export default function AboutMe() {
  return (
    <>
      <h1 align='center'>Hi 👋, I'm Sai Koushik Gandikota</h1>
      <h3 align='center'>
        An Open Source Passionate Full Stack Engineer from India
      </h3>
      <p align='left'>
        <a href='https://github.com/ryo-ma/github-profile-trophy'>
          <img
            src='https://github-profile-trophy.vercel.app/?username=skgandikota'
            alt='skgandikota'
          />
        </a>
      </p>
      <Stack direction="row" spacing={0}>
        <p>
          <img
            src='https://github-readme-stats.vercel.app/api?username=skgandikota&show_icons=true&locale=en'
            alt='skgandikota'
            width={"100%"}
            height={"100%"}
          />
        </p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;</p>
        <p>
          <img
            src='https://github-readme-streak-stats.herokuapp.com/?user=skgandikota&'
            alt='skgandikota'
            width={"100%"}
            height={"100%"}
          />
        </p>
      </Stack>
    </>
  );
}
