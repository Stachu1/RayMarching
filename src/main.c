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

    // Load the shader
    const char *fragShaderFileName = "assets/shader.frag";
    Shader shader = LoadShader(0, TextFormat(fragShaderFileName, GLSL_VERSION));

    // Load texture from file
    const char *skyboxFilePath = "assets/skybox.png";
    Texture2D skybox = LoadTexture(skyboxFilePath);

    // Get shader locations for required uniforms
    int resolutionLoc = GetShaderLocation(shader, "resolution");
    int mouseLoc = GetShaderLocation(shader, "mouse");
    int timeLoc = GetShaderLocation(shader, "time");
    // int skyboxLoc = GetShaderLocation(shader, "skybox");

    printf("ResLoc: %d\n", resolutionLoc);
    printf("MouseLoc: %d\n", mouseLoc);
    printf("TimeLoc: %d\n", timeLoc);
    // printf("TextureLoc: %d\n", skyboxLoc);

    // Pass resolution and texture data to the shader
    float resolution[2] = { (float)screenWidth, (float)screenHeight };
    SetShaderValue(shader, resolutionLoc, resolution, SHADER_UNIFORM_VEC2);
    // SetShaderValueTexture(shader, skyboxLoc, skybox);

    float totalTime = 0.0f;

    time_t lastModificationTime = GetFileModificationTime(fragShaderFileName);

    SetTargetFPS(60);

    uint32_t frame = 0;
    while (!WindowShouldClose())
    {   frame++;
        totalTime += GetFrameTime();

        // Print frame time every 32 frames
        if (frame % 512 == 0) {
            printf("Avg Frame Time: %.2f ms\n", totalTime * 1000 / frame);
        }

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

            // Set shader values
            SetShaderValue(shader, resolutionLoc, resolution, SHADER_UNIFORM_VEC2);
            // SetShaderValueTexture(shader, skyboxLoc, skybox); // Pass skybox texture to shader
        }

        // Set shader required uniform values
        SetShaderValue(shader, timeLoc, &totalTime, SHADER_UNIFORM_FLOAT);
        SetShaderValue(shader, mouseLoc, mousePos, SHADER_UNIFORM_VEC2);

        BeginDrawing();
        BeginShaderMode(shader);
        DrawTexture(skybox, 0, 0, WHITE);
        EndShaderMode();
        EndDrawing();
    }

    UnloadShader(shader);
    UnloadTexture(skybox);
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