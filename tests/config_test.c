#include <assert.h>
#include <math.h>
#include <stdio.h>
#include "config.h"
#include "disaster.h"

int main(void) {
    ResqnetConfig config;
    assert(resqnet_config_load("server/config.json", &config));
    assert(config.responsePreparationSeconds == 60);
    assert(fabs(config.severityWeight - 10.0) < 0.000001);
    assert(fabs(config.peopleAffectedWeight - 0.5) < 0.000001);

    Disaster incident = {1, 0, 0, 8, 12, 0};
    DisasterScoreWeights weights = {
        config.severityWeight,
        config.peopleAffectedWeight,
    };
    assert(fabs(disaster_score(&incident, &weights) - 86.0) < 0.000001);

    puts("Loaded shared dispatch config and calculated the expected priority score.");
    return 0;
}
