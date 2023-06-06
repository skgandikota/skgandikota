import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';

const Experience = () => {
  const experiences = [
    {
      company: 'ABC Company',
      position: 'Software Engineer',
      duration: '2018 - Present',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
      company: 'XYZ Corporation',
      position: 'Frontend Developer',
      duration: '2015 - 2018',
      description: 'Praesent convallis diam eu diam fermentum.',
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Experience
      </Typography>
      {experiences.map((experience, index) => (
        <Grid container key={index} spacing={2}>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {experience.company}
            </Typography>
          </Grid>
          <Grid item xs={12} md={9}>
            <Typography variant="subtitle1">
              {experience.position}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {experience.duration}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {experience.description}
            </Typography>
          </Grid>
        </Grid>
      ))}
    </Paper>
  );
};

export default Experience;
