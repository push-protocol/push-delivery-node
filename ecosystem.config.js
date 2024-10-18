module.exports = {
  apps : [{
    name: "Push Delivery Node",
    script: "build/app.js",
    instances: "1",
    max_memory_restart: "256M",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
