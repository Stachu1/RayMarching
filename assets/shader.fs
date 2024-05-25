#version 330 core

out vec4 finalColor;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

#define PI 3.14159265359

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Camera {
    vec3 position;
    vec3 direction;
};

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};


const vec3 bg_color = vec3(0.0, 0.2, 0.2);
const Camera camera = Camera(vec3(0.0, 0.0, -1.6), vec3(0.0, 0.0, 1.0));
const Sphere sphere = Sphere(vec3(0.0, 0.0, 0.0), 1.0, vec3(1.0, 0.8, 0.2));
const float gamma = 1.0 / 1.6;
const vec3 light_position_1 = vec3(-5.0, 5.0, -2.0);
const vec3 light_color_1 = vec3(0.7, 0.0, 1.0);
const vec3 light_position_2 = vec3(5.0, 5.0, -2.0);
const vec3 light_color_2 = vec3(0.0, 0.7, 1.0);

vec3 ray_march(Ray ray);
float get_distance_from_point(vec3 point);
vec3 get_normal(vec3 point);
vec3 sample_color(vec3 ray_dir, vec3 norm, vec3 point);
vec3 apply_gamma(vec3 color);


void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy - 1.0;
    vec2 mouse_uv = 2.0 * mouse.xy / resolution.xy - 1.0;
    mouse_uv.y *= -1;
    
    Ray ray = Ray(camera.position, normalize(vec3(uv, 1.0)));    

    vec3 color = ray_march(ray);

    color = apply_gamma(color);

    finalColor = vec4(color, 0.8);
}


vec3 apply_gamma(vec3 color) {
    return vec3(pow(color.x, gamma), pow(color.y, gamma), pow(color.z, gamma));
}

vec3 get_color(vec3 ray_dir, vec3 norm, vec3 point) {
    float brightness = dot(norm, -ray_dir);
    vec3 color = sphere.color;
    color.x *= brightness;
    color.y *= pow(brightness, 2.5);
    color.z *= (0.5 - 0.5 * brightness);

    vec3 view_dir = normalize(camera.position - point);

    vec3 halfway_dir = normalize(normalize(light_position_1 - point) + view_dir);
    float spec = pow(max(dot(norm, halfway_dir), 0.0), 32.0);
    vec3 specular = light_color_1 * spec;

    halfway_dir = normalize(normalize(light_position_2 - point) + view_dir);
    spec = pow(max(dot(norm, halfway_dir), 0.0), 32.0);
    specular += light_color_2 * spec;

    return color + specular;
}

vec3 get_normal(vec3 point) {
    const vec3 small_step = vec3(0.01, 0.0, 0.0);
    float g_x = get_distance_from_point(point + small_step.xyy) - get_distance_from_point(point - small_step.xyy);
    float g_y = get_distance_from_point(point + small_step.yxy) - get_distance_from_point(point - small_step.yxy);
    float g_z = get_distance_from_point(point + small_step.yyx) - get_distance_from_point(point - small_step.yyx);
    return normalize(vec3(g_x, g_y, g_z));
}

float get_distance_from_point(vec3 point) {
    float mod_time = mod(time, 2*PI);
    float dis = length(point - sphere.center) - sphere.radius;
    
    float displacement = sin(7.0 * point.x) * sin(11.0 * point.y) * sin(17.0 * point.z - 5.0 * mod_time);
    displacement *= 0.05 + sin(mod_time * 2.0) * 0.03;

    return dis + displacement;
}

vec3 ray_march(in Ray ray) {
    float dis_traveled = 0.0;
    const int NUM_OF_STEPS = 100;
    const float MIN_HIT_DIS = 0.001;
    const float MAX_TRACE_DIS = 100.0;

    for (int i = 0; i < NUM_OF_STEPS; i++) {
        vec3 pos = ray.origin + dis_traveled * ray.direction;
        float dis_to_closest = get_distance_from_point(pos);

        if (dis_to_closest < MIN_HIT_DIS) {
            vec3 norm = get_normal(pos - sphere.center);
            // vec3 dir_to_light = normalize(pos - light_position);
            // float diffuse_intensity = max(0.0, dot(norm, dir_to_light));
            return get_color(ray.direction, norm, pos);
        }

        if (dis_traveled > MAX_TRACE_DIS) {
            break;
        }

        dis_traveled += dis_to_closest;
    }
    return bg_color;
}