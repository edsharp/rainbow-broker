import App, { Container } from "next/app";
import React from "react";
import io from "socket.io-client";

class LogoSimulatorApp extends App {
  state = {
    socket: null
  };
  componentDidMount() {
    // connect to WS server and listen event
    const socket = io();
    this.setState({ socket });
  }

  // close socket connection
  componentWillUnmount() {
    this.state.socket.close();
  }

  render() {
    const { Component, pageProps } = this.props;
    return (
      <Container>
        <Component {...pageProps} socket={this.state.socket} />
      </Container>
    );
  }
}

export default LogoSimulatorApp;
