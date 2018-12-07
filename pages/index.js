import fetch from "isomorphic-unfetch";
import { Component } from "react";
import Logo from "../components/logo";
import MirrorQueueMonitor from "../components/mirror_queue_monitor";
import https from "https";

class LogoDisplay extends Component {
  static async getInitialProps({ req }) {
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    const response = await fetch("https://localhost:3001/mirror/info", {
      agent
    });
    const mirror = await response.json();
    return { mirror };
  }

  state = {
    pixels: Array(43).fill([0, 0, 0]),
    mirrorPixels: Array(43).fill([0, 0, 0]),
    subscribe: false,
    subscribed: false,
    displayName: "",
    displayPassword: "",
    log: "You need to register the display\n",
    registered: false
  };

  subscribe = () => {
    if (this.state.subscribe && !this.state.subscribed) {
      this.props.socket.on("mirror.updated", mirror => {
        this.setState({ mirror });
      });
      this.props.socket.on("render", pixels => {
        this.setState({ pixels });
      });
      this.props.socket.on("render.mirror", pixels => {
        this.setState({ mirrorPixels: pixels });
      });
      this.setState({
        subscribed: true
      });
    }
  };
  componentDidMount() {
    this.subscribe();
  }

  componentDidUpdate() {
    this.subscribe();
  }

  static getDerivedStateFromProps(props, state) {
    if (props.socket && !state.subscribe)
      return {
        mirror: props.mirror,
        subscribe: true
      };
    return null;
  }

  componentWillUnmount() {
    this.props.socket.off("mirror.updated");
  }

  displayNameChange = event => {
    this.setState({ displayName: event.target.value });
  };

  displayPasswordChange = event => {
    this.setState({ displayPassword: event.target.value });
  };

  handleRequestMirror = () => {
    this.props.socket.emit("mirror.request");
  };

  handleSubmit = event => {
    event.preventDefault();
    this.props.socket.emit(
      "register",
      {
        type: "display",
        name: this.state.displayName,
        password: this.state.displayPassword
      },
      response => {
        this.setState(prevState => ({
          log: prevState.log + response.message + "\n"
        }));
        console.log(response);
        if (response.success) {
          this.setState({ registered: true });
        }
      }
    );
  };

  render() {
    return (
      <main>
        <form onSubmit={e => this.handleSubmit(e)}>
          <fieldset disabled={this.state.registered}>
            <legend>My display</legend>
            <Logo pixels={this.state.pixels} />
            <br />
            <input
              onChange={this.displayNameChange}
              type="text"
              placeholder="Name"
              value={this.state.displayName}
            />
            <br />
            <input
              onChange={this.displayPasswordChange}
              type="password"
              placeholder="Password"
              value={this.state.displayPassword}
            />
            <br />
            <button>{this.state.registered ? "Registered" : "Register"}</button>
          </fieldset>
        </form>
        <br />
        <form onSubmit={e => e.preventDefault()}>
          <fieldset disabled={!this.state.registered}>
            <legend>Virtual mirror</legend>
            <Logo pixels={this.state.mirrorPixels} />
            <MirrorQueueMonitor mirror={this.state.mirror} />
            <button onClick={this.handleRequestMirror}>Request mirror</button>
          </fieldset>
        </form>
        <br />
        Log:
        <br />
        <textarea cols="80" rows="10" readOnly={true} value={this.state.log} />
      </main>
    );
  }
}

export default LogoDisplay;
