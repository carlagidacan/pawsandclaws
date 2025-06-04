// Breed suggestions data
const breedSuggestions = {
    dog: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", "Beagle", 
          "Poodle", "Rottweiler", "Yorkshire Terrier", "Boxer", "Dachshund"],
    cat: ["Siamese", "Persian", "Maine Coon", "Ragdoll", "Bengal", 
          "British Shorthair", "Abyssinian", "Scottish Fold", "Sphynx", "Russian Blue"],
    bird: ["Parakeet", "Cockatiel", "Lovebird", "Canary", "Finch", 
           "African Grey", "Macaw", "Cockatoo", "Amazon Parrot", "Budgerigar"],
    rabbit: ["Holland Lop", "Mini Rex", "Netherland Dwarf", "Lionhead", 
             "Flemish Giant", "English Angora", "French Lop", "Mini Lop"],
    hamster: ["Syrian", "Dwarf Campbell Russian", "Dwarf Winter White Russian", 
              "Roborovski", "Chinese", "Hybrid"]
};

// Handle pet avatar upload preview
document.getElementById('pet-avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('pet-avatar-preview');
            preview.src = event.target.result;
            preview.style.display = 'block';
            document.querySelector('.pet-avatar-upload .upload-icon').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

// Set up breed suggestions
document.getElementById('pet-type').addEventListener('change', function() {
    const type = this.value;
    const breedInput = document.getElementById('pet-breed');
    const suggestionsContainer = document.getElementById('breed-suggestions');
    
    // Clear previous breed input when type changes
    breedInput.value = '';
    suggestionsContainer.style.display = 'none';
    
    breedInput.addEventListener('input', function() {
        const input = this.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        
        if (type && input.length > 1 && breedSuggestions[type]) {
            const matches = breedSuggestions[type].filter(breed => 
                breed.toLowerCase().includes(input)
            );
            
            if (matches.length > 0) {
                matches.forEach(breed => {
                    const div = document.createElement('div');
                    div.className = 'breed-suggestion-item';
                    div.textContent = breed;
                    div.addEventListener('click', function() {
                        breedInput.value = breed;
                        suggestionsContainer.style.display = 'none';
                    });
                    suggestionsContainer.appendChild(div);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
});

// Hide suggestions when clicking elsewhere
document.addEventListener('click', function(e) {
    const breedInput = document.getElementById('pet-breed');
    const suggestionsContainer = document.getElementById('breed-suggestions');
    if (e.target !== breedInput) {
        suggestionsContainer.style.display = 'none';
    }
});

// Save pet function
async function savePet() {
    try {
        // Check authentication
        const token = localStorage.getItem('token');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!token || !currentUser) {
            window.location.href = 'client_login.html';
            return;
        }

        // Basic validation
        const petName = document.getElementById('pet-name').value;
        const petType = document.getElementById('pet-type').value;
        const petBreed = document.getElementById('pet-breed').value;
        const petGender = document.getElementById('pet-gender').value;
        
        if (!petName || !petType || !petBreed || !petGender) {
            alert('Please fill in all required fields (marked with *)');
            return;
        }

        // Create pet data object
        const petData = {
            name: petName,
            type: petType,
            breed: petBreed,
            gender: petGender,
            ownerId: currentUser._id,
            birthdate: document.getElementById('pet-birthdate').value || null,
            age: document.getElementById('pet-age').value || null,
            description: document.getElementById('pet-description').value,
            weight: document.getElementById('pet-weight').value || null,
            microchipId: document.getElementById('pet-microchip').value,
            isSpayed: document.getElementById('pet-spayed').checked,
            vaccinations: {
                rabies: document.getElementById('vaccine-rabies').checked,
                dhp: document.getElementById('vaccine-dhp').checked,
                bordetella: document.getElementById('vaccine-bordetella').checked
            },
            allergies: document.getElementById('pet-allergies').value,
            medicalConditions: document.getElementById('pet-conditions').value,
            temperament: document.getElementById('pet-temperament').value,
            activityLevel: document.getElementById('pet-activity').value,
            behavior: {
                goodWithDogs: document.getElementById('behavior-good-dogs').checked,
                goodWithCats: document.getElementById('behavior-good-cats').checked,
                goodWithKids: document.getElementById('behavior-good-kids').checked
            },
            notes: document.getElementById('pet-notes').value
        };

        // Handle image upload if a file was selected
        const avatarInput = document.getElementById('pet-avatar-input');
        if (avatarInput.files.length > 0) {
            const formData = new FormData();
            formData.append('avatar', avatarInput.files[0]);
            
            // First upload the image
            const imageUploadResponse = await makeAuthenticatedRequest('/api/pets/upload-avatar', {
                method: 'POST',
                headers: {
                    // Don't set Content-Type here, it will be set automatically for FormData
                },
                body: formData
            });

            if (!imageUploadResponse) {
                throw new Error('Failed to upload pet avatar');
            }

            const imageData = await imageUploadResponse.json();
            if (imageUploadResponse.ok) {
                petData.avatarUrl = imageData.url;
            } else {
                throw new Error(imageData.message || 'Failed to upload pet avatar');
            }
        }

        // Send pet data to server
        const response = await makeAuthenticatedRequest('/api/pets/add', {
            method: 'POST',
            body: JSON.stringify(petData)
        });

        if (!response) {
            throw new Error('Failed to add pet');
        }

        const data = await response.json();
        if (response.ok) {
            alert('Pet added successfully!');
            window.location.href = 'client_pets.html';
        } else {
            throw new Error(data.message || 'Failed to add pet');
        }

    } catch (error) {
        console.error('Error saving pet:', error);
        alert('Failed to save pet. Please try again.');
    }
}
