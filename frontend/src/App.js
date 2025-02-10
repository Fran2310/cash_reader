import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import MainApp from './components/MainApp';
import NotFound from './components/NotFound';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={MainApp} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
};

export default App;
