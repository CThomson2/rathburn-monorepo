import styles from "./page.module.css";

export default function Home(): React.ReactNode {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Welcome to Rathburn Ops</h1>
      <p className={styles.text}>Basic page setup complete</p>
    </main>
  );
}