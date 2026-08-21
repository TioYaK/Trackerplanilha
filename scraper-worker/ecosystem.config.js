module.exports = {
  apps: [
    {
      name: "auroria-worker",
      script: "./src/index.js",
      instances: 2, // Número de processos (ajuste conforme a capacidade da máquina)
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
