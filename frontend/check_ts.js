const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  console.log("No errors.");
} catch (e) {
  const output = e.stdout.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  require('fs').writeFileSync('ts_errors.log', output);
  console.log("Errors written to ts_errors.log");
}
