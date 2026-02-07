## UnitTests Using Jest Testing Framework.

## How to run the test
1. `cd frontend/conuwalks`
2. Install dependencies

   ```bash
   npm install
   ```

3. Install Required Libraries: 
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @testing-library/react-hooks react-test-renderer@19.1.0 @types/jest --legacy-peer-deps

4. package.json - Add test script: 
"test": "jest --verbose" 

5. npm test 

6. To run test in watch mode: 
npm test -- --watch

7. To run with coverage 
npm test -- --coverage

8. Clear caches and run tests
npm test -- --clearCache
npm test


