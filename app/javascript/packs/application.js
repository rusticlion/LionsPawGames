// Support component names relative to this directory:
import '../stylesheets/application.scss';

var ReactRailsUJS = require("react_ujs");
const componentRequireContext = require.context("../components", true);
ReactRailsUJS.useContext(componentRequireContext);