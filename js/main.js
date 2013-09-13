
function tableCtrl($scope, $http) {
    // default val for xmlFile
    $scope.xmlFile = '/julius_caesar.xml';

    $scope.loadStats = function() {
        $http.get($scope.xmlFile).success(function(data) {
            var find = "&"; // 
            var regex = new RegExp(find, "g");
            var xml = data.replace(regex, "&amp;"); // find all the & and entitize them

            var x2js = new X2JS();
            var xmlDoc = x2js.parseXmlString(xml);
            var json = x2js.xml2json( xmlDoc ); // convert the xml file to json

            $scope.roles = [];

            try { // just in case the format of the xml is not what we expect
                $scope.scenesCount = $scope.totalScenes(json);
                var roles = $scope.getRoles(json);
                var values = $scope.calculateLines(json); 

                // doing this in case there are speakers who are not in the specified 'roles'
                angular.forEach(roles, function(role) {
                    // setting null values to 0 so that sorting works
                    if (!values[role]) {
                        values[role] = {
                            lines: 0,
                            speech: 0,
                            scenes: []
                        }
                    };
                    
                    $scope.roles.push({role: role, values: values[role]});
                });
            } catch(e) {
                alert('Error parsing the xml file. ' + e);
            }
            
        }).error(function() {
            alert('There was an error processing your request. Please try again.')
        });
    };

    $scope.loadStats();


    $scope.setSort = function(sort) {
        if ($scope.sort === sort) {
            $scope.sort = '-' + sort;
        } else {
            $scope.sort = sort;
        }
    }

    // assumes that roles come directly from PLAY.PERSONAE.PERSONA even though there are other PERSONAs listed in PGROUPs
    $scope.getRoles = function(json) {
        var roles = [];

        /* This gets the all personas listed in PGROUPS
        angular.forEach(json.PLAY.PERSONAE.PGROUP, function (pgroup) {
            angular.forEach(pgroup.PERSONA, function (persona) {
                if (!roles[persona]) {
                    roles.push(persona);
                }
            });            
        });
        */

        // Only uses PERSONAE.PERSONA for our 'roles' 
        roles = json.PLAY.PERSONAE.PERSONA;
        return roles;
    }

    /*
     *  Calculates the number of lines a role has, the longest speech length, and the number
     *  of scenes that a role was seen in.
     */
    $scope.calculateLines = function(json) {
        var roles = {}; // hash of role to values

        angular.forEach(json.PLAY.ACT, function (act) {
            angular.forEach(act.SCENE, function(scene) {
                angular.forEach(scene.SPEECH, function(speech) {
                    // create an array of speakers for when there are multiple speakers per speech
                    var speakerArr = typeof(speech.SPEAKER) === 'object' ? speech.SPEAKER : [speech.SPEAKER];
                    angular.forEach(speakerArr, function(speaker) {
                        if (roles[speaker]) {
                            // the xml to json converter makes it so that if there is only 1 line, its a text field instead of an array
                            var lines = typeof speech.LINE === 'object' ? speech.LINE.length : 1;
                            if (typeof(lines) === 'undefined') {
                                lines = 1; // this is a weird case where there is a STAGEDIR in the line and lines will come back as undefined
                            }
                            roles[speaker].lines += lines;

                            // check to see if this speaker has spoke in this scene before
                            if (!in_array(scene, roles[speaker].scenes)) {
                                roles[speaker].scenes.push(scene);
                            }

                            // check to see if this speech is longer than a previous one
                            if (roles[speaker].speech < lines) {
                                roles[speaker].speech = lines;
                            }
                        } else { // first time this speaker has spoke
                            if (typeof(speech.LINE) === 'undefined') {
                                return; // continue
                            }
                            var lines = typeof speech.LINE === 'object' ? speech.LINE.length : 1; 
                            roles[speaker] = {
                                lines: lines,
                                speech: lines,
                                scenes: [scene]
                            };
                        }
                    });
                });
            });
        });

        return roles;
    }

    /*
     * Returns the total number of scenes found in the play
     */
    $scope.totalScenes = function(json) {
        var total = 0;
        angular.forEach(json.PLAY.ACT, function (act) {
            angular.forEach(act.SCENE, function(scene) {
                total++;
            });
        });

        return total;
    }

    /*
     * Utility script to see if an item exists in an array
     */
    function in_array(item, arr) {
        var i;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] === item)
                return true;
        }

        return false;
    }
}
