<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SnakeCaseRequests
{
    public function handle(Request $request, Closure $next)
    {
        $request->replace($this->snakeCaseArrayKeys($request->all()));
        return $next($request);
    }

    private function snakeCaseArrayKeys(array $array): array
    {
        $snakeArray = [];
        foreach ($array as $key => $value) {
            $snakeKey = is_string($key) ? Str::snake($key) : $key;
            if (is_array($value)) {
                $snakeArray[$snakeKey] = $this->snakeCaseArrayKeys($value);
            } else {
                $snakeArray[$snakeKey] = $value;
            }
        }
        return $snakeArray;
    }
}
