import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import fetch from "node-fetch";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

function Feature({ src, alt, href }) {
  return (
    <Tooltip title={alt} arrow disableInteractive>
      <a href={href}>
        <Avatar alt={alt} src={src} variant="rounded" sx={{ width: 60, height: 60 }} />
      </a>
    </Tooltip>
  );
}



async function getLangugageAndTools() {
  return  await fetch(
    "https://raw.githubusercontent.com/skgandikota/skgandikota/main/static/data/languagaandtools.json"
  ).then((res) => res.json())
  .then((data) => data);
}

export default function LangugageAndTools() {
  const [FeatureList, setFeatureList] = React.useState([]);
  React.useEffect(async () => {
    setFeatureList(await getLangugageAndTools());
  }, []);
  const committedFieldsToAdd = 10;

  return (
    <>
      <h1 align='center'> 👨‍💻 Languages & Tools 🧰</h1>
      {FeatureList != undefined ? (
        <section className={styles.features}>
          <div className='container'>
            <div className={styles.row}>
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <Stack direction='row' spacing={1} padding={1}>
            {[...Array(committedFieldsToAdd)].map((_value, _index) => (
              <SkeletonFeature />
            ))}
          </Stack>
          <Stack direction='row' spacing={1} padding={1}>
            {[...Array(committedFieldsToAdd)].map((_value, _index) => (
              <SkeletonFeature />
            ))}
          </Stack>
          <Stack direction='row' spacing={1} padding={1}>
            {[...Array(committedFieldsToAdd)].map((_value, _index) => (
              <SkeletonFeature />
            ))}
          </Stack>
        </>
      )}
    </>
  );
}
