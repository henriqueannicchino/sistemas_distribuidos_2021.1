import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import MissingOnesMap from './pages/MissingOnesMap';

const Routes = () => (
    <Router>
        <Switch>
            <Route exact path="/" component={MissingOnesMap}/>
        </Switch>
    </Router>
);

export default Routes;