#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/types.h>
#include <sys/stat.h>
#include "raylib.h"
#include "rlgl.h"


#define GLSL_VERSION 330

time_t GetFileModificationTime(const char *fileName);

int main(void)
{
    const int screenWidth = 500;
    const int screenHeight = 500;

    InitWindow(screenWidth, screenHeight, "RLFS");

    const char *fragShaderFileName = "assets/shader.fs";

    Shader shader = LoadShader(0, TextFormat(fragShaderFileName, GLSL_VERSION));

    // Get shader locations for required uniforms
    int resolutionLoc = GetShaderLocation(shader, "resolution");
    int mouseLoc = GetShaderLocation(shader, "mouse");
    int timeLoc = GetShaderLocation(shader, "time");

    float resolution[2] = { (float)screenWidth, (float)screenHeight };
    SetShaderValue(shader, resolutionLoc, resolution, SHADER_UNIFORM_VEC2);

    float totalTime = 0.0f;

    time_t lastModificationTime = GetFileModificationTime(fragShaderFileName);

    SetTargetFPS(60);

    uint8_t i = 0;
    while (!WindowShouldClose())
    {   
        i++;
        if (i == 255) {
            printf("Frame Time: %.2f ms\n", GetFrameTime() * 1000);
        }

        totalTime += GetFrameTime();
        Vector2 mouse = GetMousePosition();
        float mousePos[2] = { mouse.x, mouse.y };

        // Check if the shader file has been modified
        time_t currentModificationTime = GetFileModificationTime(fragShaderFileName);
        if (currentModificationTime != lastModificationTime) {
            lastModificationTime = currentModificationTime;

            // Unload the previous shader and load the new one
            UnloadShader(shader);
            shader = LoadShader(0, TextFormat(fragShaderFileName, GLSL_VERSION));

            // Update uniform locations
            resolutionLoc = GetShaderLocation(shader, "resolution");
            mouseLoc = GetShaderLocation(shader, "mouse");
            timeLoc = GetShaderLocation(shader, "time");

            SetShaderValue(shader, resolutionLoc, resolution, SHADER_UNIFORM_VEC2);
        }

        // Set shader required uniform values
        SetShaderValue(shader, timeLoc, &totalTime, SHADER_UNIFORM_FLOAT);
        SetShaderValue(shader, mouseLoc, mousePos, SHADER_UNIFORM_VEC2);

        BeginDrawing();
        BeginShaderMode(shader);
        DrawRectangle(0, 0, screenWidth, screenHeight, WHITE);
        EndShaderMode();
        EndDrawing();
    }

    UnloadShader(shader);
    CloseWindow();
    return 0;
}


// Function to get the last modification time of a file
time_t GetFileModificationTime(const char *fileName) {
    struct stat fileStat;
    if (stat(fileName, &fileStat) == 0) {
        return fileStat.st_mtime;
    }
    return 0;
}