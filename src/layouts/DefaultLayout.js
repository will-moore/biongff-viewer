import { Fragment } from 'react';

import { Outlet } from 'react-router-dom';

const DefaultLayout = (props) => {
  return (
    <Fragment>
      <main>
        {props.children}
        <Outlet />
      </main>
    </Fragment>
  );
};

export default DefaultLayout;
