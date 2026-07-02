<?php

namespace App\Models;

use Illuminate\Support\Str;

trait CamelCaseApi
{
    public function toArray()
    {
        $array = parent::toArray();
        $camelArray = [];
        
        foreach ($array as $key => $value) {
            // Recursively convert array values (for relationships)
            if (is_array($value)) {
                $camelArray[Str::camel($key)] = $this->camelizeArray($value);
            } else {
                $camelArray[Str::camel($key)] = $value;
            }
        }
        
        return $camelArray;
    }

    private function camelizeArray(array $array)
    {
        $camelArray = [];
        foreach ($array as $key => $value) {
            $newKey = is_string($key) ? Str::camel($key) : $key;
            if (is_array($value)) {
                $camelArray[$newKey] = $this->camelizeArray($value);
            } else {
                $camelArray[$newKey] = $value;
            }
        }
        return $camelArray;
    }
}
