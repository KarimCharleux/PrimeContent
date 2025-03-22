interface Project {
  id: string;
  title: string;
  imageSrc: string;
  videoSrc?: string;
  link: string;
}

const latestProjectsData: Project[] = [
  {
    id: 'wedding-video',
    title: 'Vidéo de Mariage',
    imageSrc: '/home/projects/image1.jpg',
    link: '/portfolio/wedding-video'
  },
  {
    id: 'dj-event',
    title: 'Événement DJ',
    imageSrc: '/home/projects/image2.jpg',
    link: '/portfolio/dj-event'
  },
  {
    id: 'jewelry-collection',
    title: 'Collection de Bijoux',
    imageSrc: '/home/projects/image3.jpg',
    link: '/portfolio/jewelry-collection'
  }
];

export default latestProjectsData; 