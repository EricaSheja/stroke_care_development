def find_largest(numbers):
    largest = numbers[0]

    for number in numbers:
        if number > largest:
            largest = number

    return largest

print (find_largest([4,10,2,25,8]))

def find_largest(numbers):
    largest = numbers[0]

    for number in numbers:
        if number > largest:
            largest = number

    return largest

print(find_largest([4,10,2,25,8]))

def count_vowels(word):
    count = 0

    for letter in word.lower():
        if letter in "aeiou":
            count += 1
    
    return count

print(count_vowels("Malaika"))   

def count_vowels(word):
    count = 0

    for letter in word.lower():
        if letter in "aeiou":
            count += 1
    return count

print(count_vowels("Malaika"))

for number in range(1, 21):
    if number % 3 == 0 and number %5 == 0:
        print("FizzBuzz")

    elif number % 3 == 0:
        print("Fizz")

    elif number % 5 == 0:
        print("Buzz")

    else:
        print(number)

def remove_duplicates(numbers):
    result = []

    for number in numbers:
        if number not in result:
            result.append(number)

    return result

print(remove_duplicates([1,2,2,3,3,4,4,5]))

def remove_duplicates(numbers):
    result = []

    for number in numbers:
        if number not in result:
            result.append(number)

    return result

print(remove_duplicates([1,1,2,3,4,4])) 

def second_largest(numbers):
    unique = list(set(numbers))
    unique.sort()

    return unique [-2]

print(second_largest([18,19,34,56]))

def second_largest(numbers):
    unique = list(set(numbers))
    unique.sort()

    return unique[-2]

print(second_largest([18,19,34,56]))

def reverse_string(text):
    return text[::-1]
print(reverse_string("Malaika"))

def reverse_string(text):
    return text[::-1]
print(reverse_string("Samuel"))

def is_palindrone(text):
    return text == text[::-1]

print(is_palindrone("Bob"))

