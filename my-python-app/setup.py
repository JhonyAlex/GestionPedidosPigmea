from setuptools import setup, find_packages

setup(
    name='my-python-app',
    version='0.1.0',
    author='Tu Nombre',
    author_email='tu.email@example.com',
    description='Una breve descripción de tu aplicación',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        # Aquí puedes listar las dependencias de tu proyecto
    ],
)