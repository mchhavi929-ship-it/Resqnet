#ifndef RESQNET_CONFIG_H
#define RESQNET_CONFIG_H

typedef struct {
    int responsePreparationSeconds;
    double severityWeight;
    double peopleAffectedWeight;
} ResqnetConfig;

int resqnet_config_load(const char* path, ResqnetConfig* config);

#endif
