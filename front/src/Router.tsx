import React, { lazy, Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";

const Homepage = lazy(() => import("./containers/Homepage"));

export default () => (
  <BrowserRouter>
    <Suspense
      fallback={
        <div
          style={ {
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          } }
        >
          <div style={ { maxWidth: 800 } }>Loading page</div>
        </div>
      }
    >
      <Switch>
        <Route exact path="/" component={ Homepage }/>
      </Switch>
    </Suspense>
  </BrowserRouter>
)
