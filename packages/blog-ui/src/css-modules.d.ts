// Let TS resolve CSS-module imports (`import styles from './styles.module.css'`).
declare module '*.module.css' {
  const classes: {readonly [key: string]: string};
  export default classes;
}
