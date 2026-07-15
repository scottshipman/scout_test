<?php

namespace App\Document;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case User = 'user';
}
