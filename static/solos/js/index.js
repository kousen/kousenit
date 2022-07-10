// Dependencies:
// https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// https://cdnjs.cloudflare.com/ajax/libs/html5media/1.1.8/html5media.min.js
// https://cdnjs.cloudflare.com/ajax/libs/plyr/2.0.18/plyr.js

// Inspiration: http://jonhall.info/how_to/create_a_playlist_for_html5_audio
// Mythium Archive: https://archive.org/details/mythium/


jQuery(function ($) {
    'use strict'
    var supportsAudio = !!document.createElement('audio').canPlayType;
    if (supportsAudio) {
        var index = 0,
            playing = false,
            mediaPath = 'http://www.kousenit.com/solos/',
            //mediaPath = '',
            extension = '',
            tracks = [{
                "track": 1,
                "name": "I Only Have Eyes For You",
                "duration": "3:28",
                "file": "I_only_have_eyes_for_you.mp3"
            }, {
                "track": 2,
                "name": "The Shadow Of Your Smile",
                "duration": "2:27",
                "file": "Shadow_Of_Your_Smile.mp3"
            }, {
                "track": 3,
                "name": "Still",
                "duration": "3:42",
                "file": "Still.mp3"
            }, {
                "track": 4,
                "name": "When I Fall In Love",
                "duration": "3:30",
                "file": "When_I_fall_in_love.mp3"
            }, {
                "track": 5,
                "name": "You And I",
                "duration": "3:54",
                "file": "you_and_I.mp3"
            }, {
                "track": 6,
                "name": "Strangers In The Night",
                "duration": "2:48",
                "file": "strangers_in_the_night.mp3"
            }, {
                "track": 7,
                "name": "What I Did For Love",
                "duration": "4:49",
                "file": "What_I_Did_For_Love.mp3"
            }, {
                "track": 8,
                "name": "It's Impossible",
                "duration": "3:14",
                "file": "Its_Impossible.m4a"
            }, {
                "track": 9,
                "name": "And I Love You So",
                "duration": "3:16",
                "file": "And_I_Love_You_So.mp3"
            }, {
                "track": 10,
                "name": "After The Loving",
                "duration": "3:44",
                "file": "After_the_Loving.mp3"
            }, {
                "track": 11,
                "name": "Annie's Song",
                "duration": "3:01",
                "file": "Annies_Song.mp3"
            }, {
                "track": 12,
                "name": "Hold On",
                "duration": "4:05",
                "file": "Hold_On.m4a"
            }, {
                "track": 13,
                "name": "More",
                "duration": "2:25",
                "file": "More.mp3"
            }, {
                "track": 14,
                "name": "You Raise Me Up",
                "duration": "4:50",
                "file": "You_Raise_Me_Up.mp3"
            }, {
                "track": 15,
                "name": "Bridge Over Troubled Water",
                "duration": "4:50",
                "file": "Bridge_Over_Troubled_Water.mp3"
            }, {
                "track": 16,
                "name": "Lady",
                "duration": "3:49",
                "file": "lady.mp3"
            }, {
                "track": 17,
                "name": "Where Do I Begin?",
                "duration": "3:13",
                "file": "where_do_I_begin.mp3"
            }],
            buildPlaylist = $(tracks).each(function(key, value) {
                var trackNumber = value.track,
                    trackName = value.name,
                    trackDuration = value.duration;
                if (trackNumber.toString().length === 1) {
                    trackNumber = '0' + trackNumber;
                }
                $('#plList').append('<li><div class="plItem"><span class="plNum">' + trackNumber + '.</span><span class="plTitle">' + trackName + '</span><span class="plLength">' + trackDuration + '</span></div></li>');
            }),
            trackCount = tracks.length,
            npAction = $('#npAction'),
            npTitle = $('#npTitle'),
            audio = $('#audio1').on('play', function () {
                playing = true;
                npAction.text('Now Playing...');
            }).on('pause', function () {
                playing = false;
                npAction.text('Paused...');
            }).on('ended', function () {
                npAction.text('Paused...');
                if ((index + 1) < trackCount) {
                    index++;
                    loadTrack(index);
                    audio.play();
                } else {
                    audio.pause();
                    index = 0;
                    loadTrack(index);
                }
            }).get(0),
            btnPrev = $('#btnPrev').on('click', function () {
                if ((index - 1) > -1) {
                    index--;
                    loadTrack(index);
                    if (playing) {
                        audio.play();
                    }
                } else {
                    audio.pause();
                    index = 0;
                    loadTrack(index);
                }
            }),
            btnNext = $('#btnNext').on('click', function () {
                if ((index + 1) < trackCount) {
                    index++;
                    loadTrack(index);
                    if (playing) {
                        audio.play();
                    }
                } else {
                    audio.pause();
                    index = 0;
                    loadTrack(index);
                }
            }),
            li = $('#plList li').on('click', function () {
                var id = parseInt($(this).index());
                if (id !== index) {
                    playTrack(id);
                }
            }),
            loadTrack = function (id) {
                $('.plSel').removeClass('plSel');
                $('#plList li:eq(' + id + ')').addClass('plSel');
                npTitle.text(tracks[id].name);
                index = id;
                audio.src = mediaPath + tracks[id].file + extension;
            },
            playTrack = function (id) {
                loadTrack(id);
                audio.play();
            };
        // extension = audio.canPlayType('audio/mpeg') ? '.mp3' :
        // audio.canPlayType('audio/ogg') ? '.ogg' :
        // audio.canPlayType('audio/m4a') ? '.m4a' :
        // '';
        loadTrack(index);
    }
});

// initialize plyr
plyr.setup($('#audio1'), {});
