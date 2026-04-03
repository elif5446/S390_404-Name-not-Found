// Grab the current index from Maestro's output state, or default to 0
let current = output.stepIndex || 0;
output.stepIndex = current + 1;
