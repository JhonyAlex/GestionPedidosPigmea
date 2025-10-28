<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pedido extends Model
{
    use HasFactory;

    protected $fillable = [
        // ...existing code...
        'camisa',
        'antivaho',
        'anonimo',
    ];

    // ...existing code...
}