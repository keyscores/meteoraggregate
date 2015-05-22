/* globals Player: false, Song: false */

describe('Player', function() {
  var player;
  var song;

  beforeEach(function() {
    player = new Player();
    song = new Song();
  });

  it('should run inside a mirror', function() {
    expect(process.env.IS_MIRROR).toBeTruthy();
  });

  it('should have access to just 1 contract', function() {
    expect(Contract.find({}).count()).toEqual(1);
  });

  it('should be able to play a Song', function() {
    player.play(song);
    expect(player.currentlyPlayingSong).toEqual(song);
    console.info('HI THERE FROM SERVER');
    //demonstrates use of custom matcher
    expect(player).toBePlaying(song);
  });

  describe('when song has been paused', function() {
    beforeEach(function() {
      player.play(song);
      player.pause();
    });

    it('should indicate that the song is currently paused', function() {
      expect(player.isPlaying).toBeFalsy();

      // demonstrates use of 'not' with a custom matcher
      expect(player).not.toBePlaying(song);
    });

    it('should be possible to resume', function() {
      player.resume();
      expect(player.isPlaying).toBeTruthy();
      expect(player.currentlyPlayingSong).toEqual(song);
    });
  });

  // demonstrates use of spies to intercept and test method calls
  it('tells the current song if the user has made it a favorite', function() {
    spyOn(song, 'persistFavoriteStatus');

    player.play(song);
    player.makeFavorite();

    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
  });
});
