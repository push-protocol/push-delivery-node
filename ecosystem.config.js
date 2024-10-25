module.exports = {
  apps : [{
    name: "Push Delivery Staging",
    script: "build/app.js",
    instances: "1",
    max_memory_restart: "2048M",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
