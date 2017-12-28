import React, {
  Component,
} from 'react';
import PropTypes from 'prop-types';

class Story extends Component {
  constructor(props) {
    super(props);

    this.state = {
      storyName: 'New Story',
      latestStory: null,
      voteValue: '',
      initialized: false,
    };

    this.handleStoryNameChange = this.handleStoryNameChange.bind(this);
    this.handleVoteChange = this.handleVoteChange.bind(this);
    this.handleVoteSubmit = this.handleVoteSubmit.bind(this);
    this.createStory = this.createStory.bind(this);
    this.getLatestStory = this.getLatestStory.bind(this);
    this.showVoteValue = this.showVoteValue.bind(this);
    this.lastInteraction = new Date();

    setTimeout(() => {
      this.getLatestStory();
    }, 1000);
  }

  getLatestStory(e) {
    const diff = Math.abs(new Date() - this.lastInteraction);
    // knock out after 15 min of inactivity
    if (diff > 1000 * 60 * 15) {
      window.location('/');
    }
    // delay until needed
    if (this.props.sessionKey === '' || !document.hasFocus()) {
      setTimeout(() => {
        this.getLatestStory();
      }, 1000);
      return;
    }
    const gSI = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      cache: 'default',
    };

    const gSR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/story`, gSI);
    fetch(gSR, gSI).then(resp => resp.json()).then((data) => {
      if (data.length > 0) {
        const latestStory = data[data.length - 1];
        if (this.state.latestStory == null || this.state.latestStory.story_key !== latestStory.story_key) {
          this.setState({ voteValue: '' });
        }
        this.setState({ latestStory, initialized: true });
      } else {
        this.setState({ initialized: true });
      }
    }).catch((error) => {
      console.log(`error: ${error}`);
    });
    setTimeout(() => {
      this.getLatestStory();
    }, 1000);
  }

  createStory(e) {
    e.preventDefault();
    this.lastInteraction = new Date();
    const cSI = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: this.state.storyName }),
      mode: 'cors',
      cache: 'default',
    };

    const cSR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/story`, cSI);
    fetch(cSR, cSI).then(resp => resp.json()).then((data) => {
      this.setState({
        latestStory: data,
        voteValue: '',
      });
    }).catch((error) => {
      alert(`error: ${error}`);
    });
  }

  handleStoryNameChange(e) {
    this.setState({
      storyName: e.target.value,
    });
  }

  handleVoteSubmit(e) {
    e.preventDefault();
    const vI = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_key: this.props.userKey, vote: this.state.voteValue }),
      mode: 'cors',
      cache: 'default',
    };

    const vR = new Request(`https://api.dogpointing.com/session/${this.props.sessionKey}/story/${this.state.latestStory.story_key}`, vI);
    fetch(vR, vI).then(resp => resp.json()).then((data) => {
      this.setState({
        latestStory: data,
      });
    }).catch((error) => {
      alert(`error: ${error}`);
    });
  }

  handleVoteChange(e) {
    this.lastInteraction = new Date();
    this.setState({ voteValue: e.target.value });
  }

  showVoteValue(vote) {
    if (this.state.latestStory.complete) {
      return vote.value;
    }
    if (this.props.userKey === vote.key && vote.value !== 'Cat') {
      return vote.value;
    }
    if (vote.value !== 'Cat') {
      return 'voted';
    }
    return 'voting...';
  }

  render() {
    return (
      <div className="App" style={{ display: (this.state.initialized ? 'inline-block' : 'none') }}>
        <form onSubmit={this.createStory}>
          <input
            type="text"
            defaultValue={
    this.state.storyName
    }
            size="12"
            onChange={
    this.handleStoryNameChange
    }
          />
          <input
            type="Submit"
            value="New Story"
          />
        </form>
        {this.state.latestStory != null && this.state.latestStory.votes != null &&
          <div>
            <br /><br />
            <table style={{ margin: '0px auto' }}>
              <thead>
                <tr>
                  <td colSpan="2"><b>{this.state.latestStory.name}</b></td>
                </tr>
              </thead>
              <tbody>
                {this.state.latestStory.votes.map(vote =>
            (<tr key={vote.key}>
              <td>{vote.name}</td>
              <td>{this.showVoteValue(vote)}</td>
            </tr>))}
              </tbody>
            </table>
            <form onSubmit={this.handleVoteSubmit}>
              <select defaultValue={this.state.voteValue} onChange={this.handleVoteChange} style={{ display: (this.props.observer ? 'none' : 'inline-block') }}>
                <option value="">How Big?</option>
                <option value="Chihuahua">Chihuahua</option>
                <option value="Corgi">Corgi</option>
                <option value="Pitbull">Pitbull</option>
                <option value="Labrador">Labrador</option>
                <option value="Great Dane">Great Dane</option>
              </select>
              <input type="Submit" value="Vote" />
            </form>
          </div>
        }
      </div>

    );
  }
}

Story.propTypes = {
  sessionKey: PropTypes.string.isRequired,
  userKey: PropTypes.string.isRequired,
  observer: PropTypes.bool.isRequired,
};

export default Story;
