#version 330 core

out vec4 finalColor;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float seconds;
uniform sampler2D skybox;

#define PI 3.14159265359

struct Ray {
    vec3 ori;
    vec3 dir;
};

struct Camera {
    vec3 pos;
    float rotation;
    float gamma;
};

struct Body {
    vec3 pos;
    vec3 bound;
    vec3 color;
    float refractive_index;
};


struct Light {
    vec3 pos;
    vec3 color;
};

const int MAX_NUM_OF_STEPS = 20000;
const float MAX_TRACE_DIS = 20.0;
const float MAX_ORI_DIS = 2.0;
const float MIN_HIT_DIS = 0.00001;
const float NORM_FINDING_STEP = 0.00001;

Camera camera = Camera(vec3(0.0, 1.0, -2.0), 0.0, 1.0/1.6);

Body body = Body(vec3(0.0, 0.0, 0.0), vec3(0.6, 0.6, 0.6), vec3(0.9, 0.99, 0.99), 1.05);

const Light light_1 = Light(vec3(-10.0, 10.0, 10.0), vec3(2.0, 2.0, 1.0));
const Light light_2 = Light(vec3(10.0, 10.0, 10.0), vec3(0.0, 1.0, 5.0));

const int light_count = 2;
const Light lights[light_count] = Light[light_count](light_1, light_2);

// Functions declarations
vec4 RayMarch(Ray ray);
float GetDistance(vec3 point);
vec3 GetNormal(vec3 point);
vec3 SampleColor(vec3 point, vec3 dir);
vec3 SampleSkybox(vec3 dir);
vec3 ApplyGamma(vec3 color);


// Main function
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy - 1.0;
    vec2 mouse_uv = 2.0 * mouse.xy / resolution.xy - 1.0;
    mouse_uv.y *= -1;

    float gamma = seconds * -0.5;
    camera.pos.x = 2.0 * sin(gamma);
    camera.pos.y = sin(1.3 * gamma);
    camera.pos.z = -2.0 * cos(gamma);
    camera.rotation = gamma;
    
    float phi = camera.rotation;
    float alp = 0.0;
    Ray ray = Ray(camera.pos, normalize(vec3(uv, 1.0)));
    ray.dir *= mat3(cos(phi), 0, -sin(phi), 0, 1, 0, sin(phi), 0, cos(phi));
    ray.dir *= mat3(1, 0, 0, 0, cos(alp), sin(alp), 0, -sin(alp), cos(alp));

    ray.dir = normalize(ray.dir);
    finalColor = RayMarch(ray);
}


// Gets distance between given point and the sphere center adding some displacement
float GetDistance(vec3 point) {
    vec3 q = abs(point - body.pos) - body.bound;
    float dis = length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    
    // float d_time = mod(seconds, 2*PI);
    // float diff = sin(5.0 * point.x) * sin(3.0 * point.z + 2.0 * d_time);
    // diff *= 0.05 + sin(d_time*2) * 0.03;
    // return dis + diff;

    return dis;
}

// Approximate the normal vector for a given point on the sphere surface
vec3 GetNormal(vec3 point) {
    const vec3 step = vec3(NORM_FINDING_STEP, 0.0, 0.0);
    float x = GetDistance(point + step.xyy) - GetDistance(point - step.xyy);
    float y = GetDistance(point + step.yxy) - GetDistance(point - step.yxy);
    float z = GetDistance(point + step.yyx) - GetDistance(point - step.yyx);
    return normalize(vec3(x, y, z));
}


// Applys gamma correction to the given color
vec3 ApplyGamma(vec3 color) {
    return vec3(pow(color.r, camera.gamma), pow(color.g, camera.gamma), pow(color.b, camera.gamma));
}


// Samples skybox based on the ray direction
vec3 SampleSkybox(vec3 dir) {
    float u = 0.5 - atan(dir.z, dir.x) / (2.0 * PI);
    float v = 0.5 - asin(dir.y) / PI;
    return texture(skybox, vec2(u, v)).rgb;
}


// Calculates Refraction/Reflection
Ray Refract(Ray ray) {
    float u = body.refractive_index;
    if (GetDistance(ray.ori) > 0.0) u = 1.0 / body.refractive_index;
    
    vec3 norm = GetNormal(ray.ori);
    if (GetDistance(ray.ori) > 0.0) norm *= -1;
    ray.ori += norm * MIN_HIT_DIS * 2.0;
    
    float sin_thet = sqrt(1 - pow(dot(norm, ray.dir), 2.0));

    if (u * sin_thet < 1) {
        // Refraction
        ray.dir = sqrt(1.0 - pow(u, 2.0) * (1.0 - pow(dot(norm, ray.dir), 2.0))) * norm + u * (ray.dir - dot(norm, ray.dir) * norm);
    }
    else {
        // Reflection
        ray.dir = ray.dir - norm * dot(ray.dir, norm) * 2.0;
    }
    return ray;
}


// Petforms ray marching and return color as vec4
vec4 RayMarch(Ray ray) {
    int total_num_of_steps = 0;
    float total_traveled = 0.0;
    float dis = 0;
    vec3 tint = vec3(1.0);

    while (total_traveled < MAX_TRACE_DIS && total_num_of_steps < MAX_NUM_OF_STEPS && dis < MAX_ORI_DIS) {
        float traveled = 0.0;
        while (true) {
            vec3 pos = ray.dir * traveled + ray.ori;
            dis = GetDistance(pos);

            traveled += abs(dis);
            total_traveled += abs(dis);
            total_num_of_steps++;

            if (total_traveled >= MAX_TRACE_DIS || total_num_of_steps >= MAX_NUM_OF_STEPS || dis > MAX_ORI_DIS) break;
            
            if (abs(dis) < MIN_HIT_DIS) {
                tint *= body.color;
                ray.ori = pos;
                ray = Refract(ray);
                break;

            }
        }
    }

    // For debuging:
    // if (total_traveled >= MAX_TRACE_DIS) return vec4(1.0, 1.0, 0.0, 1.0);
    // if (total_num_of_steps >= MAX_NUM_OF_STEPS) return vec4(1.0, 0.0, 1.0, 1.0);

    if (total_num_of_steps >= MAX_NUM_OF_STEPS) return vec4(0.0);
    return vec4(ApplyGamma(SampleSkybox(ray.dir) * tint), 1.0);
}