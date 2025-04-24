import { Route, Routes } from 'react-router-dom';

import Viewer from '@app/components/viewer/ViewerIndex';
import DefaultLayout from '@app/layouts/DefaultLayout';

const AllRoutes = () => {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Viewer />} />
      </Route>
    </Routes>
  );
};

export default AllRoutes;
