export default {
  logo: <strong>Mars and Memory Docs</strong>,
  project: {
    link: 'https://github.com/yixuan-liu/mars-and-memory'
  },
  docsRepositoryBase: 'https://github.com/yixuan-liu/mars-and-memory/tree/main/apps/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Mars and Memory'
    }
  }
}
