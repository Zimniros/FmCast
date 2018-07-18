import React, { Component } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import momentDurationFormatSetup from "moment-duration-format";
import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { withApollo, graphql, compose } from "react-apollo";
import { remove } from "lodash";

import getUpnext from "./../../queries/getUpnext";
import getFavorites from "./../../queries/getFavorites";

import removeFromUpnext from "./../../queries/removeFromUpnext";
import addToUpnext from "./../../queries/addToUpnext";
import removeFromFavorites from "./../../queries/removeFromFavorites";
import addToFavorites from "./../../queries/addToFavorites";
import markAsUnplayed from "./../../queries/markAsUnplayed";
import markAsPlayed from "./../../queries/markAsPlayed";

class Episode extends Component {
  formatDate(date) {
    if (date && moment(date).isValid()) {
      const format =
        moment(date).year() === moment().year() ? "MMM D" : "MMM D, YYYY";
      return moment(date).format(format);
    }
    return "";
  }

  formatDuration(seconds) {
    if (!seconds) return "";
    return moment.duration(seconds, "seconds").format();
  }

  handlePlayedStatus(id, podcastId, isPlayed) {
    const { markAsUnplayed, markAsPlayed } = this.props;

    isPlayed
      ? markAsUnplayed({
          variables: {
            id,
            podcastId
          }
        })
          .then(res => console.log("Episode marked as unplayed", res.data))
          .catch(err => console.log(err))
      : markAsPlayed({
          variables: {
            id,
            podcastId
          }
        })
          .then(res => console.log("Episode marked as played", res.data))
          .catch(err => console.log(err));
  }

  handleUpnext(id, podcastId, isInUpNext) {
    const { removeFromUpnext, addToUpnext, client } = this.props;
    isInUpNext
      ? removeFromUpnext({
          variables: {
            id,
            podcastId
          },
          update: (proxy, { data: { removeFromUpnext } }) => {
            try {
              const data = proxy.readQuery({ query: getUpnext });
              remove(data.upnext, n => n.id === removeFromUpnext.id);
              proxy.writeQuery({ query: getUpnext, data });
            } catch (e) {
              client.query({ query: getUpnext });
              console.log("query haven't been called", e);
            }
          }
        }).catch(err => console.log(err))
      : addToUpnext({
          variables: {
            id,
            podcastId
          },
          update: (proxy, { data: { addToUpnext } }) => {
            try {
              const data = proxy.readQuery({ query: getUpnext });
              remove(data.upnext, n => n.id === removeFromUpnext.id);
              data.upnext
                ? data.upnext.push(addToUpnext)
                : (data.upnext = [addToUpnext]);
              proxy.writeQuery({ query: getUpnext, data });
            } catch (e) {
              client.query({ query: getUpnext });
              console.log("query haven't been called", e);
            }
          }
        }).catch(err => console.log(err));
  }

  handleFavorites(id, podcastId, isInFavorites) {
    const { removeFromFavorites, addToFavorites, client } = this.props;
    isInFavorites
      ? removeFromFavorites({
          variables: {
            id,
            podcastId
          },
          update: (proxy, { data: { removeFromFavorites } }) => {
            try {
              const data = proxy.readQuery({ query: getFavorites });
              remove(data.favorites, n => n.id === removeFromFavorites.id);
              proxy.writeQuery({ query: getFavorites, data });
            } catch (e) {
              client.query({ query: getFavorites });
              console.log("query haven't been called", e);
            }
          }
        })
          .then(res => console.log("Episode removed from Favorites", res.data))
          .catch(err => console.log(err))
      : addToFavorites({
          variables: {
            id,
            podcastId
          },
          update: (proxy, { data: { addToFavorites } }) => {
            try {
              const data = proxy.readQuery({ query: getFavorites });
              data.favorites
                ? data.favorites.push(addToFavorites)
                : (data.favorites = [addToFavorites]);

              proxy.writeQuery({ query: getFavorites, data });
            } catch (e) {
              client.query({ query: getFavorites });
              console.log("query haven't been called", e);
            }
          }
        })
          .then(res => console.log("Episode added Favorites", res.data))
          .catch(err => console.log(err));
  }

  render() {
    const {
      episode,
      isPlayingEpisode,
      openWarningModal,
      handleEpisodeModal,
      handleClick,
      isLoggedIn
    } = this.props;
    const episodeClassName = `episode${
      isPlayingEpisode ? " episode--playing" : ""
    }${episode.inUpnext ? " episode--in-upnext" : ""}${
      episode.inFavorites ? " episode--in-favorites" : ""
    }${episode.isPlayed ? " episode--played" : ""}`;

    return (
      <div className={episodeClassName}>
        {episode.podcastArtworkUrl ? (
          <Link to={`/podcasts/${episode.podcastId}`}>
            <div
              className="episode__artwork"
              style={{
                backgroundImage: `url("${episode.podcastArtworkUrl}")`
              }}
            />
          </Link>
        ) : null}
        <div className="episode__info">
          <div className="episode__primary">
            <div className="episode__title">
              <p
                className="title__text"
                title={episode.title}
                onClick={() =>
                  handleEpisodeModal(episode.id, episode.podcastId)
                }
              >
                {episode.title}
              </p>
              <svg
                className="star__icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 168.8 160.5"
                onClick={() =>
                  isLoggedIn
                    ? this.handleFavorites(
                        episode.id,
                        episode.podcastId,
                        episode.inFavorites
                      )
                    : openWarningModal()
                }
              >
                <path d="M168.8 61.3l-58.3-8.5L84.4 0 58.3 52.8 0 61.3l42.2 41.1-10 58.1 52.2-27.4 52.2 27.4-10-58.1 42.2-41.1z" />
              </svg>
            </div>
          </div>

          {episode.author ? (
            <p className="episode__author">
              {" "}
              <Link to={`/podcasts/${episode.podcastId}`}>
                {episode.author}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="episode__pub-date">
          <p>{this.formatDate(episode.pubDate)}</p>
        </div>
        <div className="episode__duration">
          <p>{this.formatDuration(episode.duration)}</p>
        </div>
        <div className="episode__controls">
          <div
            onClick={() =>
              isLoggedIn && !isPlayingEpisode
                ? this.handlePlayedStatus(
                    episode.id,
                    episode.podcastId,
                    episode.isPlayed
                  )
                : console.log("loggin on signup")
            }
          >
            <svg
              className="controls__status-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 405.72 298.71"
            >
              <path
                className="status-icon__unplayed"
                d="M398.42 7.29a25.07 25.07 0 0 0-35.35 0L131.5 238.86 42.65 150a25.08 25.08 0 0 0-35.36 0 25.08 25.08 0 0 0 0 35.36l106.07 106.06a25.09 25.09 0 0 0 31.36 3.25 25 25 0 0 0 6.22-4.54L398.42 42.65a25.07 25.07 0 0 0 0-35.36z"
              />
              <path
                className="status-icon__played"
                d="M238.07 149L344.13 42.94a25.07 25.07 0 0 0 0-35.36 25.07 25.07 0 0 0-35.35 0L202.71 113.65 96.65 7.58a25.08 25.08 0 0 0-35.36 0 25.08 25.08 0 0 0 0 35.36L167.36 149 61.29 255.07a25.07 25.07 0 0 0 0 35.35 25.07 25.07 0 0 0 35.36 0l106.06-106.06 106.07 106.06a25.05 25.05 0 0 0 35.35 0 25.05 25.05 0 0 0 0-35.35z"
              />
            </svg>
          </div>
          <div
            onClick={() =>
              isLoggedIn && !isPlayingEpisode
                ? this.handleUpnext(
                    episode.id,
                    episode.podcastId,
                    episode.inUpnext
                  )
                : console.log("loggin on signup")
            }
          >
            <svg
              className="controls__up-next"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 179 152.5"
            >
              <path
                className="up-next__add"
                d="M173 30.21h-24.21V6a6 6 0 1 0-12.08 0v24.21h-24.17a6.06 6.06 0 0 0-6 6 6.06 6.06 0 0 0 6 6h24.17v24.25a6 6 0 1 0 12.08 0V42.29H173a6.06 6.06 0 0 0 6-6 6.06 6.06 0 0 0-6-6.08z"
              />
              <rect y="77.5" width="150" height="25" rx="12.5" ry="12.5" />
              <rect y="127.5" width="150" height="25" rx="12.5" ry="12.5" />
              <rect y="27.5" width="100" height="25" rx="12.5" ry="12.5" />
              <path
                className="up-next__remove"
                d="M162.44 5.62l-20.13 20.12-20.13-20.12a7.11 7.11 0 0 0-10.06 10.06l20.12 20.13-20.12 20.13a7.13 7.13 0 0 0 0 10.06 7.13 7.13 0 0 0 10.06 0l20.13-20.13L162.44 66a7.11 7.11 0 0 0 10.06-10.06l-20.13-20.13 20.13-20.13a7.13 7.13 0 0 0 0-10.06 7.13 7.13 0 0 0-10.06 0z"
              />
            </svg>
          </div>
          <svg
            className="controls__play"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 250 250"
          >
            <g
              onClick={() =>
                !isPlayingEpisode
                  ? handleClick(episode.id, episode.podcastId)
                  : console.log("playing episode")
              }
              id="icon"
            >
              <g id="circle">
                <circle
                  className="play__circle"
                  cx="125"
                  cy="125"
                  r="115"
                  fill="#fff"
                />
                <path d="M125,20A105,105,0,1,1,20,125,105.12,105.12,0,0,1,125,20m0-20A125,125,0,1,0,250,125,125,125,0,0,0,125,0Z" />
              </g>
              <g className="play__inner" id="inner">
                <g className="play__bars" id="bars">
                  <g id="left">
                    <rect
                      x="92.5"
                      y="87.5"
                      width="15"
                      height="75"
                      fill="#fff"
                    />
                    <polygon points="117.5 77.5 82.5 77.5 82.5 172.5 117.5 172.5 117.5 77.5 117.5 77.5" />
                  </g>
                  <g id="right">
                    <rect
                      x="142.5"
                      y="87.5"
                      width="15"
                      height="75"
                      fill="#fff"
                    />
                    <polygon points="167.5 77.5 132.5 77.5 132.5 172.5 167.5 172.5 167.5 77.5 167.5 77.5" />
                  </g>
                </g>
                <path
                  className="play__triangle"
                  id="triangle"
                  d="M183.25,125,95.87,175.45V74.55Z"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  return { isLoggedIn: !!Meteor.userId() };
})(
  compose(
    graphql(addToUpnext, { name: "addToUpnext" }),
    graphql(removeFromUpnext, { name: "removeFromUpnext" }),
    graphql(addToFavorites, { name: "addToFavorites" }),
    graphql(removeFromFavorites, { name: "removeFromFavorites" }),
    graphql(markAsPlayed, { name: "markAsPlayed" }),
    graphql(markAsUnplayed, { name: "markAsUnplayed" })
  )(withApollo(Episode))
);
