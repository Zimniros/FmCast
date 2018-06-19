import "./../imports/startup/server";
import "./../imports/api/podcasts/podcasts";
import { ApolloEngine } from "apollo-engine";
import { WebApp } from "meteor/webapp";
import "./../imports/api/users/users";
import "./../imports/startup/simple-schema-configuration";

const engine = new ApolloEngine({
  apiKey: process.env.ENGINE_API_KEY
});

WebApp.rawConnectHandlers.use("/graphql", function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return next();
});

engine.meteorListen(WebApp);
