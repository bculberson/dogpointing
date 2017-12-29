import React, {
  Component,
} from 'react';
import './App.css';
import User from './User';
import Story from './Story';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sessionKey: '',
      userName: '',
      userKey: '',
      showJoin: true,
      showUser: true,
      observer: true,
    };


    this.handleSessionChange = this.handleSessionChange.bind(this);
    this.handleSessionJoin = this.handleSessionJoin.bind(this);
    this.createSession = this.createSession.bind(this);

    if (this.props.location.pathname.startsWith('/session/')) {
      this.state.sessionKey = this.props.location.pathname.slice(9);
      this.state.showJoin = false;
    }
  }

  handleSessionChange(e) {
    this.setState({
      sessionKey: e.target.value.toUpperCase(),
    });
  }

  handleSessionJoin(e) {
    e.preventDefault();
    if (this.state.sessionKey.length !== 5) {
      console.error(`Invalid Session: ${this.state.sessionKey}`);
    } else {
      this.setState({
        showJoin: false,
      });
    }
  }

  showStoriesFor(key, name, observer) {
    this.setState({
      userName: name,
      userKey: key,
      observer,
    });
  }

  createSession(e) {
    e.preventDefault();
    const self = this;

    const cSI = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      cache: 'default',
    };

    const cSR = new Request('https://api.dogpointing.com/session', cSI);
    fetch(cSR, cSI).then(resp => resp.json()).then((data) => {
      self.setState({
        sessionKey: data.key,
        showJoin: false,
      });
    }).catch((error) => {
      console.error(`error: ${error}`);
    });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title"> Yo Dawg I heard you like to point
          </h1>
        </header>

        <span className="App-intro" style={{ display: (this.state.showJoin ? 'inline-block' : 'none') }}>
          <form onSubmit={this.createSession}>
            <input type="Submit" value="Squirrel" readOnly="true" />
          </form>
          <form onSubmit={this.handleSessionJoin}>
            <input
              type="text"
              value={
        this.state.sessionKey
      }
              size="6"
              onChange={
        this.handleSessionChange
      }
            /> <input type="Submit" value="Join Hunt" readOnly="true" />
          </form>
        </span>
        <span className="App-intro" style={{ display: (!this.state.showJoin ? 'inline-block' : 'none') }}>
          <b>Session: <a href={`/session/${this.state.sessionKey}`}>{this.state.sessionKey}</a></b>
          <User onChange={(key, name, observer) => { this.showStoriesFor(key, name, observer); }} sessionKey={this.state.sessionKey} />
        </span>
        <div className="App-intro" style={{ display: (this.state.userName !== '' ? 'block' : 'none') }}>
          <Story sessionKey={this.state.sessionKey} userKey={this.state.userKey} observer={this.state.observer} />
        </div>
      </div>
    );
  }
}

export default App;
