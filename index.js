const { execSync } = require('child_process');

const runScript = (scriptName) => {
  try {
    execSync(`npm run ${scriptName}`);
    console.log(`Script "${scriptName}" completed successfully.`);
  } catch (error) {
    console.error(`Error running script "${scriptName}": ${error.message}`);
  }
};

// Run start script
runScript('stop');
