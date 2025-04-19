import { Route, Routes, Link } from 'react-router-dom';
import { Chart } from './components/chart';

const data = [
  { time: '2019-04-11', value: 80.01 },
  { time: '2019-04-12', value: 96.63 },
  { time: '2019-04-13', value: 76.64 },
  { time: '2019-04-14', value: 81.89 },
  { time: '2019-04-15', value: 74.43 },
  { time: '2019-04-16', value: 80.01 },
  { time: '2019-04-17', value: 96.63 },
  { time: '2019-04-18', value: 76.64 },
  { time: '2019-04-19', value: 81.89 },
  { time: '2019-04-20', value: 74.43 },
];

export const App = () => {
  return (
    <div>
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              This is the generated root route.{' '}
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <Link to="/">Click here to go back to root page.</Link>

              <Chart data={data} />
            </div>
          }
        />
      </Routes>
      {/* END: routes */}
    </div>
  );
};

export default App;
